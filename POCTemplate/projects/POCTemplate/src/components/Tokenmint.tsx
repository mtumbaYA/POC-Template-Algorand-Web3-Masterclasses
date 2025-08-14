import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface TokenMintInterface {
  openModal: boolean
  setModalState: (value: boolean) => void
}

const Tokenmint = ({ openModal, setModalState }: TokenMintInterface) => {
  const [assetName, setAssetName] = useState('')
  const [unitName, setUnitName] = useState('')
  const [totalSupply, setTotalSupply] = useState('')
  const [decimals, setDecimals] = useState('0')
  const [loading, setLoading] = useState(false)

  const { enqueueSnackbar } = useSnackbar()
  const { transactionSigner, activeAddress } = useWallet()

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algorand = AlgorandClient.fromConfig({ algodConfig })

  const handleMintToken = async () => {
    setLoading(true)

    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect your wallet first', { variant: 'warning' })
      setLoading(false)
      return
    }

    if (!assetName || !unitName || !totalSupply) {
      enqueueSnackbar('Please fill in all fields', { variant: 'warning' })
      setLoading(false)
      return
    }

    try {
      enqueueSnackbar('Creating token on TestNet...', { variant: 'info' })

      // Convert total supply to on-chain format (considering decimals)
      const onChainTotal = BigInt(totalSupply) * BigInt(10 ** Number(decimals))

      const createResult = await algorand.send.assetCreate({
        sender: activeAddress,
        signer: transactionSigner,
        total: onChainTotal,
        decimals: Number(decimals),
        assetName,
        unitName,
        defaultFrozen: false,
      })

      enqueueSnackbar(`Token created! TX ID: ${createResult.txIds[0]}`, { variant: 'success' })

      // Clear form
      setAssetName('')
      setUnitName('')
      setTotalSupply('')
      setDecimals('0')
    } catch (error) {
      console.error(error)
      enqueueSnackbar('Failed to create token', { variant: 'error' })
    }

    setLoading(false)
  }

  return (
    <dialog id="tokenmint_modal" className={`modal ${openModal ? 'modal-open' : ''} bg-slate-200`}>
      <form method="dialog" className="modal-box">
        <h3 className="font-bold text-lg">Mint a Fungible Token</h3>
        <br />

        <input
          type="text"
          placeholder="Asset Name (e.g. MasterPass Token)"
          className="input input-bordered w-full mb-2"
          value={assetName}
          onChange={(e) => setAssetName(e.target.value)}
        />

        <input
          type="text"
          placeholder="Unit Name (e.g. MPT)"
          className="input input-bordered w-full mb-2"
          value={unitName}
          onChange={(e) => setUnitName(e.target.value)}
        />

        <input
          type="number"
          placeholder="Total Supply (whole number)"
          className="input input-bordered w-full mb-2"
          value={totalSupply}
          onChange={(e) => setTotalSupply(e.target.value)}
        />

        <input
          type="number"
          placeholder="Decimals (0 for whole tokens)"
          className="input input-bordered w-full mb-4"
          value={decimals}
          onChange={(e) => setDecimals(e.target.value)}
        />

        <div className="modal-action">
          <button className="btn" onClick={() => setModalState(false)}>
            Close
          </button>
          <button
            className={`btn ${!assetName || !unitName || !totalSupply ? 'btn-disabled' : ''}`}
            onClick={handleMintToken}
          >
            {loading ? <span className="loading loading-spinner" /> : 'Mint Token'}
          </button>
        </div>
      </form>
    </dialog>
  )
}

export default Tokenmint